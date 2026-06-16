from rest_framework.response import Response
from rest_framework import status

class StandardResponse:
    """Helper to generate standardized API response structures matching the frontend's ApiResponse envelope."""
    
    @staticmethod
    def success(data=None, message="Success", status_code=status.HTTP_200_OK):
        return Response(
            {
                "success": True,
                "message": message,
                "data": data,
            },
            status=status_code
        )
        
    @staticmethod
    def error(message="Error", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        response_data = {
            "success": False,
            "message": message,
        }
        if errors is not None:
            response_data["errors"] = errors
            
        return Response(response_data, status=status_code)
