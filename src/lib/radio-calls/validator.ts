import fs from "fs";

export interface RadioCallRule {
  requiredOrder: string[];
  keywords: string[];
  examples: string[];
}

export interface ValidationResult {
  valid: boolean;
  mistakes: string[];
}

export default class RadioCallValidator {
  private schema: Record<string, RadioCallRule>;

  constructor(schemaPath: string = "radio_calls.json") {
    const fileData = fs.readFileSync(schemaPath, "utf-8");
    this.schema = JSON.parse(fileData);
  }

  public validateCall(callType: string, userCall: string): ValidationResult {
    if (!(callType in this.schema)) {
      return { valid: false, mistakes: [`Unknown call type: ${callType}`] };
    }

    const rules = this.schema[callType];

    if (!rules) {
      return {
        valid: false,
        mistakes: [`No rules found for call type: ${callType}`],
      };
    }

    const mistakes: string[] = [];

    // Check for required keywords
    if (
      !rules.keywords.some((keyword) =>
        userCall.toLowerCase().includes(keyword),
      )
    ) {
      mistakes.push(
        `Missing required keyword(s): ${rules.keywords.join(", ")}`,
      );
    }

    // Split user input and check order
    const userParts = userCall
      .split(", ")
      .map((part) => part.trim().toLowerCase());
    const expectedParts = rules.requiredOrder;

    if (userParts.length !== expectedParts.length) {
      mistakes.push(
        `Incorrect number of elements. Expected ${expectedParts.length}, got ${userParts.length}`,
      );
    }

    // Validate each part in sequence
    expectedParts.forEach((expectedPart, index) => {
      if (userParts[index] && !userParts[index].includes(expectedPart)) {
        mistakes.push(`Expected '${expectedPart}' at position ${index + 1}`);
      }
    });

    return { valid: mistakes.length === 0, mistakes };
  }
}

// Example usage:
const validator = new RadioCallValidator();
const result = validator.validateCall(
  "radio_check",
  "Heathrow Ground, Radio Check, 112.380, G-OFLY",
);
console.log(result);
