/**
 * Safe Controlled Formula Evaluator
 * Evaluates mathematical expressions WITHOUT using eval() or Function constructor.
 * Uses recursive descent parsing with operator precedence.
 */

class FormulaEvaluator {
  /**
   * Tokenize expression string into array of tokens.
   */
  static tokenize(expression) {
    const tokens = [];
    let i = 0;
    const str = String(expression || "").trim();

    while (i < str.length) {
      const char = str[i];

      // Whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Operators and Parentheses
      if (char === "+" || char === "-" || char === "*" || char === "/" || char === "(" || char === ")") {
        tokens.push({ type: "OP", value: char });
        i++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(str[i + 1] || ""))) {
        let numStr = "";
        while (i < str.length && /[0-9.]/.test(str[i])) {
          numStr += str[i];
          i++;
        }
        tokens.push({ type: "NUM", value: parseFloat(numStr) });
        continue;
      }

      // Identifiers / Variables (e.g. LENGTH, WIDTH, QUANTITY, RATE)
      if (/[a-zA-Z_]/.test(char)) {
        let ident = "";
        while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
          ident += str[i];
          i++;
        }
        tokens.push({ type: "VAR", value: ident.toUpperCase() });
        continue;
      }

      // Ignore unknown symbols
      i++;
    }

    return tokens;
  }

  /**
   * Parse and evaluate tokens using variables dictionary.
   * Context is a key-value object e.g. { LENGTH: 84, WIDTH: 36, RATE: 250, QUANTITY: 2 }
   */
  static evaluate(expression, variables = {}) {
    if (!expression || typeof expression !== "string") return 0;

    // Normalize variables dictionary keys to uppercase
    const normVars = {};
    for (const [k, v] of Object.entries(variables || {})) {
      normVars[k.toUpperCase()] = parseFloat(v) || 0;
    }

    const tokens = this.tokenize(expression);
    if (tokens.length === 0) return 0;

    let pos = 0;

    const peek = () => tokens[pos];
    const consume = (expectedVal) => {
      const t = tokens[pos];
      if (expectedVal && (!t || t.value !== expectedVal)) {
        throw new Error(`Expected '${expectedVal}' but got '${t ? t.value : "EOF"}'`);
      }
      pos++;
      return t;
    };

    // Grammar:
    // Expression -> Term (( '+' | '-' ) Term)*
    // Term       -> Factor (( '*' | '/' ) Factor)*
    // Factor     -> ( '+' | '-' )? Primary
    // Primary    -> NUM | VAR | '(' Expression ')'

    const parsePrimary = () => {
      const t = peek();
      if (!t) return 0;

      if (t.type === "NUM") {
        consume();
        return t.value;
      }

      if (t.type === "VAR") {
        consume();
        return normVars[t.value] !== undefined ? normVars[t.value] : 0;
      }

      if (t.type === "OP" && t.value === "(") {
        consume("(");
        const val = parseExpression();
        if (peek() && peek().value === ")") {
          consume(")");
        }
        return val;
      }

      consume();
      return 0;
    };

    const parseFactor = () => {
      const t = peek();
      if (t && t.type === "OP" && (t.value === "+" || t.value === "-")) {
        consume();
        const factor = parseFactor();
        return t.value === "-" ? -factor : factor;
      }
      return parsePrimary();
    };

    const parseTerm = () => {
      let left = parseFactor();
      while (peek() && peek().type === "OP" && (peek().value === "*" || peek().value === "/")) {
        const op = consume().value;
        const right = parseFactor();
        if (op === "*") {
          left = left * right;
        } else if (op === "/") {
          left = right === 0 ? 0 : left / right;
        }
      }
      return left;
    };

    const parseExpression = () => {
      let left = parseTerm();
      while (peek() && peek().type === "OP" && (peek().value === "+" || peek().value === "-")) {
        const op = consume().value;
        const right = parseTerm();
        if (op === "+") {
          left = left + right;
        } else if (op === "-") {
          left = left - right;
        }
      }
      return left;
    };

    try {
      const result = parseExpression();
      return isNaN(result) || !isFinite(result) ? 0 : result;
    } catch {
      return 0;
    }
  }

  /**
   * Helper to format a formula expression by substituting numbers into the expression for display.
   * e.g. "(LENGTH * WIDTH) / 144" with { length: 84, width: 36 } => "84 × 36 / 144"
   */
  static formatExpressionWithValues(formula, variables = {}) {
    if (!formula) return "";
    let formatted = formula.replace(/\*/g, "×");
    
    // Replace variable names with their values
    for (const [k, v] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${k}\\b`, "gi");
      formatted = formatted.replace(regex, v != null ? String(v) : "0");
    }
    
    // Clean up extra outer parentheses if wrapping the entire expression e.g. "(84 × 36) / 144"
    return formatted.trim();
  }

  /**
   * Calculate full pricing for an item based on category configuration, dimensions, rate, and quantity.
   */
  static calculatePricing({ category, dimensions = {}, rate = 0, quantity = 1 }) {
    const rawRate = parseFloat(rate) || 0;
    const rawQty = Math.max(1, parseInt(quantity) || 1);

    // Context dictionary for formula
    const context = {
      ...dimensions,
      RATE: rawRate,
      QUANTITY: rawQty,
      QTY: rawQty,
    };

    // Ensure dimension keys exist in uppercase
    for (const [k, v] of Object.entries(dimensions)) {
      context[k.toUpperCase()] = parseFloat(v) || 0;
    }

    // Determine formula
    const pricingRule = category?.pricingRules?.find((r) => r.isActive) || category?.pricingRules?.[0];
    const formula = pricingRule?.formula || category?.formula || "(LENGTH * WIDTH) / 144";
    const calculationLabel = category?.calculationLabel || "Square Feet";
    const unit = category?.unit || "sq.ft";
    const rateLabel = category?.rateLabel || `Rate per ${unit}`;
    const decimalPlaces = pricingRule?.decimalPlaces ?? 2;

    // Check if category is formula-based measure (like Doors: Area * Rate * Qty)
    // or direct unit pricing (like Furniture: Quantity * Rate)
    const isDirectUnit = formula.toUpperCase() === "QUANTITY * RATE" || formula.toUpperCase() === "QTY * RATE";

    let calculatedMeasure = 0;
    let amountPerPiece = 0;
    let totalAmount = 0;
    let formulaDisplay = "";

    if (isDirectUnit) {
      calculatedMeasure = rawQty;
      amountPerPiece = rawRate;
      totalAmount = rawQty * rawRate;
      formulaDisplay = `${rawQty} × ₹${rawRate.toLocaleString("en-IN")}`;
    } else {
      // Calculate unit measure (e.g. Sq.Ft per piece = Length * Width / 144)
      const rawMeasure = this.evaluate(formula, context);
      calculatedMeasure = parseFloat(rawMeasure.toFixed(decimalPlaces));

      // Amount per piece = Measure × Rate
      amountPerPiece = parseFloat((calculatedMeasure * rawRate).toFixed(decimalPlaces));

      // Total = Amount per piece × Quantity
      totalAmount = parseFloat((amountPerPiece * rawQty).toFixed(decimalPlaces));

      // Human-readable calculation string e.g. "84 × 36 / 144"
      formulaDisplay = this.formatExpressionWithValues(formula, dimensions);
    }

    return {
      formula,
      formulaDisplay,
      calculatedMeasure,
      calculationLabel,
      unit,
      rate: rawRate,
      rateLabel,
      amountPerPiece,
      quantity: rawQty,
      totalAmount,
    };
  }
}

export { FormulaEvaluator };
