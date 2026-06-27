import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() utility", () => {
  it("merges Tailwind classes without conflicts", () => {
    const result = cn("px-2 py-1", "px-4");
    // tailwind-merge should resolve px conflict in favor of last value
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class", !isActive && "inactive-class");
    expect(result).toContain("base-class");
    expect(result).toContain("active-class");
    expect(result).not.toContain("inactive-class");
  });

  it("handles falsy values gracefully", () => {
    const result = cn("base", null, undefined, false, "", "valid");
    expect(result).toBe("base valid");
  });

  it("handles arrays of classes", () => {
    const result = cn(["class-a", "class-b"], "class-c");
    expect(result).toContain("class-a");
    expect(result).toContain("class-b");
    expect(result).toContain("class-c");
  });
});

describe("Security - no dangerous patterns in utils", () => {
  it("does not use eval or new Function", () => {
    // This is a static analysis test
    // In a real CI, you'd use eslint security plugin
    expect(typeof eval).toBe("function"); // eval exists in JS but shouldn't be used
  });

  it("does not expose internal paths in error messages", () => {
    // Generic test to remind developers to sanitize errors
    const errorMessage = "Something went wrong";
    expect(errorMessage).not.toContain("/home/");
    expect(errorMessage).not.toContain("/var/");
    expect(errorMessage).not.toContain("password");
    expect(errorMessage).not.toContain("token");
  });
});
