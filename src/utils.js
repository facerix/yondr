/**
 * Function for consisely creating a chunk of HTML nodes
 * @param {string} tagName 
 * @param {Object | Map} attrs 
 * @param {HTMLElement[]} children 
 * @returns HTMLElement
 */
export const h = (tagName, attrs, children) => {
  const el = document.createElement(tagName);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el[key] = value;
    }
  }
  children?.forEach(child => el.appendChild(child));
  return el;
}

/**
 * Useful little template literal tagging function to make template strings behave more like JSX
 * taken almost verbatim from https://blog.jim-nielsen.com/2019/jsx-like-syntax-for-tagged-template-literals/
 * @param {string[]} strings 
 * @param {string[]} values 
 * @returns string
 */
export function jsx(strings, ...values) {
  let out = "";
  strings.forEach((string, i) => {
    const value = values[i];

    // Array - Join to string and output with value
    if (Array.isArray(value)) {
      out += string + value.join("");
    }
    // String - Output with value
    else if (typeof value === "string") {
      out += string + value;
    }
    // Number - Coerce to string and output with value
    // This would happen anyway, but for clarity's sake on what's happening here
    else if (typeof value === "number") {
      out += string + String(value);
    }
    // object, undefined, null, boolean - Don't output a value.
    else {
      out += string;
    }
  });
  return out;
};

/**
 * Utility function to wrap an array of things in an HTML list
 * @param {Array(string|object)} arrayOfThings the things to put in the list
 * @param {Boolean} isOrdered should output be an ordered or unordered list
 * @returns string of raw HTML
 */
export const listify = (arrayOfThings, isOrdered) => {
  return [
    isOrdered ? "<ol>" : "<ul>",
    ...arrayOfThings.map(i => `<li>${i}</li>`),
    isOrdered ? "</ol>" : "</ul>"
  ].join('\n');
}

export const pluralize = (quantity, thing) => {
  return jsx`
		${quantity} ${thing}${quantity !== 1 && 's'}
	`;
}

export const CreateSvg = (body, width, height, classNames = "") => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", "0 0 24 24");
  classNames && svg.setAttribute("class", classNames);
  svg.innerHTML = body;
  return svg;
};

// not intended to be fully-featured; I'll build it out as I need it
export const htmlToMarkdown = (html) => {
  let out = "";
  html.childNodes.forEach(nd => {
    if (nd.nodeType === Node.ELEMENT_NODE) {
      switch (nd.tagName) {
        case "P":
          out += `\n${htmlToMarkdown(nd)}\n`;
          break;
        case "STRONG":
          out += `*${nd.textContent}*`;
          break;
        case "UL":
          out += `\n\n${htmlToMarkdown(nd)}\n`;
          break;
        case "LI":
          out += `* ${htmlToMarkdown(nd)}\n`;
          break;
      }
    } else if (nd.nodeType == Node.TEXT_NODE) {
      out += nd.textContent;
    }
  });

  return out;
}

/**
 * Centralized function to determine if the app is running in development mode
 * @returns {boolean} true if in development mode, false otherwise
 */
export const isDevelopmentMode = () => {
	try {
		return location.hostname === 'localhost' || 
		       location.hostname === '127.0.0.1' || 
		       location.hostname.includes('local') ||
		       location.search.includes('dev=true');
	} catch (e) {
		// In case location is not available (e.g., in Service Worker context)
		return false;
	}
}

// Convert Date object to yyyy-mm-dd string
export const dateToDateString = (date) => {
  if (!date) return null;
  if (typeof date === 'string') {
    // If already in yyyy-mm-dd format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Otherwise, convert from Date object or ISO string
    date = new Date(date);
  }
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

// Convert date to yyyy-mm-dd format for date input
export const formatDate = (date) => {
  if (!date) return "";
  // If already in yyyy-mm-dd format, return as-is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  // Convert Date object or other formats to yyyy-mm-dd
  return dateToDateString(date);
};

/**
 * Calculate US federal income tax for 2025 tax year
 * @param {string} filingStatus - One of: 'single', 'married_jointly', 'married_separately', 'head_of_household'
 * @param {number} grossIncome - Total income before deductions
 * @param {number} [standardDeduction] - Optional custom standard deduction (defaults to 2025 standard deduction for filing status)
 * @returns {number} Federal income tax owed
 */
export const calculateUSIncomeTax2025 = (filingStatus, grossIncome, standardDeduction = null) => {
  // 2025 tax brackets: [bracket_end, rate]
  // Rates are progressive - each bracket applies to income within that range
  const taxBrackets = {
    single: [
      [11925, 0.10],
      [48475, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250525, 0.32],
      [626350, 0.35],
      [Infinity, 0.37]
    ],
    married_jointly: [
      [23850, 0.10],
      [96950, 0.12],
      [206700, 0.22],
      [394600, 0.24],
      [501050, 0.32],
      [751600, 0.35],
      [Infinity, 0.37]
    ],
    married_separately: [
      [11925, 0.10],
      [48475, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250525, 0.32],
      [375800, 0.35],
      [Infinity, 0.37]
    ],
    head_of_household: [
      [17000, 0.10],
      [64850, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250500, 0.32],
      [626350, 0.35],
      [Infinity, 0.37]
    ]
  };

  // 2025 standard deductions
  const standardDeductions2025 = {
    single: 15750,
    married_jointly: 31500,
    married_separately: 15750,
    head_of_household: 23625
  };

  // Validate filing status
  if (!taxBrackets[filingStatus]) {
    throw new Error(`Invalid filing status: ${filingStatus}. Must be one of: single, married_jointly, married_separately, head_of_household`);
  }

  // Validate income
  if (typeof grossIncome !== 'number' || grossIncome < 0 || isNaN(grossIncome)) {
    throw new Error('Gross income must be a non-negative number');
  }

  // Use provided standard deduction or default for filing status
  const deduction = standardDeduction !== null ? standardDeduction : standardDeductions2025[filingStatus];

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossIncome - deduction);

  // If no taxable income, no tax owed
  if (taxableIncome <= 0) {
    return 0;
  }

  // Calculate progressive tax
  let tax = 0;
  let previousBracketEnd = 0;
  const brackets = taxBrackets[filingStatus];

  for (const [bracketEnd, rate] of brackets) {
    if (taxableIncome > previousBracketEnd) {
      // Calculate income in this bracket
      const incomeInBracket = Math.min(taxableIncome, bracketEnd) - previousBracketEnd;
      tax += incomeInBracket * rate;
      previousBracketEnd = bracketEnd;
    } else {
      break;
    }
  }

  // Round to 2 decimal places (cents)
  return Math.round(tax * 100) / 100;
};
