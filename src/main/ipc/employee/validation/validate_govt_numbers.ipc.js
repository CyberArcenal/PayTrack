// ===================== validate_govt_numbers.ipc.js =====================


/**
 * Validate government numbers
 * @param {string} sss
 * @param {string} philhealth
 * @param {string} pagibig
 * @param {string} tin
 * @returns {{status: boolean, message: string, data: any}}
 */
module.exports = function validateGovernmentNumbers(sss, philhealth, pagibig, tin) {
  const errors = [];
  const warnings = [];

  // SSS validation (Philippines)
  if (sss) {
    // Remove dashes and spaces
    const cleanSSS = sss.replace(/[-\s]/g, "");
    if (!/^\d{10}$/.test(cleanSSS)) {
      errors.push("SSS number must be 10 digits");
    }
  }

  // PhilHealth validation (Philippines)
  if (philhealth) {
    const cleanPhilhealth = philhealth.replace(/[-\s]/g, "");
    if (!/^\d{12}$/.test(cleanPhilhealth)) {
      errors.push("PhilHealth number must be 12 digits");
    }
  }

  // Pag-IBIG validation (Philippines)
  if (pagibig) {
    const cleanPagibig = pagibig.replace(/[-\s]/g, "");
    if (!/^\d{12}$/.test(cleanPagibig)) {
      errors.push("Pag-IBIG number must be 12 digits");
    }
  }

  // TIN validation (Philippines)
  if (tin) {
    const cleanTIN = tin.replace(/[-\s]/g, "");
    if (!/^\d{9,12}$/.test(cleanTIN)) {
      errors.push("TIN must be 9 to 12 digits");
    }
  }

  return {
    status: errors.length === 0,
    message: errors.length === 0 ? "Government numbers are valid" : "Validation failed",
    data: {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedNumbers: {
        sss,
        philhealth,
        pagibig,
        tin,
      },
    },
  };
};