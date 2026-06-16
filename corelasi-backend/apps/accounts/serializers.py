from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from accounts.models import User, PasswordResetRequest
from accounts.showcase import is_showcase_account
from academic.models import Kelas

class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for displaying and updating complete user profile details."""
    nipOrNis = serializers.CharField(source="nip_or_nis", required=False, allow_null=True, allow_blank=True)
    phoneNumber = serializers.CharField(source="phone_number", required=False, allow_null=True, allow_blank=True)
    kelasId = serializers.PrimaryKeyRelatedField(
        source="kelas",
        queryset=Kelas.objects.all(),
        required=False,
        allow_null=True
    )
    kelasName = serializers.SerializerMethodField(read_only=True)
    assignments = serializers.SerializerMethodField(read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id", "email", "name", "role", "status", 
            "nipOrNis", "gender", "phoneNumber", 
            "kelasId", "kelasName", "assignments",
            "password", "angkatan"
        )
        extra_kwargs = {
            "gender": {"required": False, "allow_null": True, "allow_blank": True},
        }

    def get_kelasName(self, obj):
        return obj.kelas.name if obj.kelas else None

    def get_assignments(self, obj):
        if obj.role != "guru":
            return None
        
        # Dynamically query if teacher is assigned as wali kelas in the active academic year
        from academic.models import TahunAjaran
        active_ta = TahunAjaran.objects.filter(status="aktif").first()
        if active_ta:
            kelas_perwalian = Kelas.objects.filter(wali_kelas=obj, tahun_ajaran=active_ta).first()
        else:
            kelas_perwalian = Kelas.objects.filter(wali_kelas=obj).first()
            
        is_wali_kelas = kelas_perwalian is not None
        wali_kelas_name = kelas_perwalian.name if is_wali_kelas else None
        wali_kelas_id = kelas_perwalian.id if is_wali_kelas else None

        return {
            "isPengampu": obj.is_pengampu,
            "isPiketToday": obj.is_piket_today,
            "isWaliKelas": is_wali_kelas,
            "waliKelasName": wali_kelas_name,
            "waliKelasId": wali_kelas_id
        }

    def validate(self, attrs):
        # Determine the role (if updating, fall back to instance's role)
        instance_role = self.instance.role if self.instance else None
        role = attrs.get("role", instance_role or "siswa")
        password = attrs.get("password")

        if self.instance is None and not password:
            raise serializers.ValidationError(
                {"password": "Kata sandi wajib diisi untuk pengguna baru."}
            )

        if password:
            candidate_user = self.instance or User(
                email=attrs.get("email", ""),
                name=attrs.get("name", ""),
                role=role,
            )
            try:
                validate_password(password, user=candidate_user)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        
        # Helper to get field value safely (either from attrs, or from self.instance if updating)
        def get_field(name, db_name):
            if name in attrs:
                return attrs[name]
            if self.instance and hasattr(self.instance, db_name):
                return getattr(self.instance, db_name)
            return None

        nip_or_nis = get_field("nip_or_nis", "nip_or_nis")
        
        # Enforce validation matching frontend rules
        if role == "guru" and not nip_or_nis:
            raise serializers.ValidationError({"nipOrNis": "NIP wajib diisi untuk Guru."})
        if role == "siswa" and not nip_or_nis:
            raise serializers.ValidationError({"nipOrNis": "NIS wajib diisi untuk Siswa."})
            
        # Clean up fields based on role
        if role != "siswa" and "kelas" in attrs:
            attrs["kelas"] = None
            
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        
        # Extract kelas since it's mapped to source="kelas"
        kelas = validated_data.pop("kelas", None)
        
        # Create user with remaining fields
        user = User.objects.create_user(email=email, password=password, **validated_data)
        if kelas:
            user.kelas = kelas
            user.save()
            
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        request = self.context.get("request")
        if password and request and is_showcase_account(instance):
            raise serializers.ValidationError(
                {"password": "Akun showcase tidak dapat mengubah kata sandi."}
            )
        if password:
            instance.set_password(password)
            
        # Standard update
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

class PasswordResetRequestSerializer(serializers.ModelSerializer):
    """Serializer to represent password reset requests to the admin."""
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    requestedAt = serializers.DateTimeField(source="requested_at", read_only=True)

    class Meta:
        model = PasswordResetRequest
        fields = ("id", "email", "name", "role", "requestedAt", "status")

class PasswordResetRequestCreateSerializer(serializers.Serializer):
    """Serializer to validate and receive a new password reset request."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        email_clean = value.lower().strip()
        try:
            user = User.objects.get(email__iexact=email_clean)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Email tidak terdaftar di sistem. Silakan periksa kembali email Anda atau hubungi Admin sekolah."
            )
        
        if PasswordResetRequest.objects.filter(user=user, status="pending").exists():
            raise serializers.ValidationError(
                "Permintaan atur ulang kata sandi Anda sebelumnya masih dalam antrean proses Admin."
            )
        
        return email_clean

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom SimpleJWT serializer that injects additional fields into the JWT payload and login response."""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add claims to the token payload (visible to frontend on decode)
        token["email"] = user.email
        token["role"] = user.role
        token["name"] = user.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Attach access/refresh keys matching frontend nomenclature
        # simplejwt uses 'access' and 'refresh'. We map them to 'accessToken' and 'refreshToken'
        data["accessToken"] = data.pop("access")
        data["refreshToken"] = data.pop("refresh")
        
        # Add user details to response using the detailed serializer so the frontend has full profile context
        data["user"] = UserDetailSerializer(self.user).data
        return data
