import { describe, it, expect } from "vitest";
import {
  camelToSnake,
  snakeToCamel,
  toSnakeCase,
  toCamelCase,
} from "../utils/case";

describe("Case Conversion Utilities", () => {
  describe("toSnakeCase", () => {
    it("should convert simple camelCase to snake_case", () => {
      expect(toSnakeCase("myVariableName")).toBe("my_variable_name");
      expect(toSnakeCase("classId")).toBe("class_id");
    });
  });

  describe("toCamelCase", () => {
    it("should convert simple snake_case to camelCase", () => {
      expect(toCamelCase("my_variable_name")).toBe("myVariableName");
      expect(toCamelCase("class_id")).toBe("classId");
    });
  });

  describe("camelToSnake", () => {
    it("should convert nested object keys to snake_case", () => {
      const input = {
        userId: 1,
        profileDetail: {
          fullName: "John Doe",
          birthDate: new Date("2000-01-01"),
        },
        subjectsList: [
          { subjectName: "Math", minGrade: 75 },
          { subjectName: "Science", minGrade: 80 },
        ],
      };

      const result = camelToSnake<{
        user_id: number;
        profile_detail: { full_name: string; birth_date: Date };
        subjects_list: Array<{ subject_name: string; min_grade: number }>;
      }>(input);

      expect(result.user_id).toBe(1);
      expect(result.profile_detail.full_name).toBe("John Doe");
      expect(result.profile_detail.birth_date).toBeInstanceOf(Date);
      expect(result.subjects_list[0].subject_name).toBe("Math");
      expect(result.subjects_list[1].min_grade).toBe(80);
    });

    it("should return primitive values untouched", () => {
      expect(camelToSnake(42)).toBe(42);
      expect(camelToSnake("hello")).toBe("hello");
      expect(camelToSnake(null)).toBeNull();
    });
  });

  describe("snakeToCamel", () => {
    it("should convert nested object keys to camelCase", () => {
      const input = {
        user_id: 1,
        profile_detail: {
          full_name: "John Doe",
          birth_date: new Date("2000-01-01"),
        },
        subjects_list: [
          { subject_name: "Math", min_grade: 75 },
          { subject_name: "Science", min_grade: 80 },
        ],
      };

      const result = snakeToCamel<{
        userId: number;
        profileDetail: { fullName: string; birthDate: Date };
        subjectsList: Array<{ subjectName: string; minGrade: number }>;
      }>(input);

      expect(result.userId).toBe(1);
      expect(result.profileDetail.fullName).toBe("John Doe");
      expect(result.profileDetail.birthDate).toBeInstanceOf(Date);
      expect(result.subjectsList[0].subjectName).toBe("Math");
      expect(result.subjectsList[1].minGrade).toBe(80);
    });

    it("should return primitive values untouched", () => {
      expect(snakeToCamel(42)).toBe(42);
      expect(snakeToCamel("hello")).toBe("hello");
      expect(snakeToCamel(null)).toBeNull();
    });
  });
});
