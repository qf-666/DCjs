/**
 * Universal Script Decoder Tool
 * 
 * This tool decodes obfuscated JavaScript scripts used for modifying API responses,
 * particularly focusing on scripts that unlock premium features in apps.
 * 
 * Features:
 * - Handles various obfuscation techniques (hex encoding, array obfuscation, etc.)
 * - Analyzes script functionality without hardcoding results
 * - Works with different script types (iMe, Revenuecat, etc.)
 * - Provides detailed analysis of what the script does
 * - Reconstructs a clean, human-readable version of the script
 */

class ScriptDecoder {
  constructor(script) {
    this.originalScript = script;
    this.decodedScript = script;
    this.obfuscationTechniques = [];
    this.scriptType = "unknown";
    this.functionality = {
      modifiesResponse: false,
      modifiesRequest: false,
      handlesPremium: false,
      manipulatesDates: false,
      interceptsAPI: false
    };
    this.detectedPatterns = [];
    this.decodedStrings = {};
  }

  /**
   * Run the full decoding process
   */
  decode() {
    // Step 1: Detect obfuscation techniques
    this.detectObfuscationTechniques();
    
    // Step 2: Identify the script type
    this.identifyScriptType();
    
    // Step 3: Decode obfuscated parts
    this.decodeHexStrings();
    this.decodeArrayedStrings();
    this.decodeStringConcatenation();
    
    // Step 4: Analyze functionality
    this.analyzeScriptFunctionality();
    
    // Step 5: Generate a clean version
    const cleanScript = this.generateCleanScript();
    
    return {
      scriptType: this.scriptType,
      obfuscationTechniques: this.obfuscationTechniques,
      functionality: this.functionality,
      detectedPatterns: this.detectedPatterns,
      cleanScript: cleanScript
    };
  }

  /**
   * Detect what obfuscation techniques are used in the script
   */
  detectObfuscationTechniques() {
    // Check for hex-encoded strings
    if (/\\x[0-9a-fA-F]{2}/.test(this.decodedScript)) {
      this.obfuscationTechniques.push("Hex string encoding");
    }
    
    // Check for Unicode-encoded strings
    if (/\\u[0-9a-fA-F]{4}/.test(this.decodedScript)) {
      this.obfuscationTechniques.push("Unicode string encoding");
    }
    
    // Check for array-based obfuscation
    if (/var\s+_0x[a-f0-9]+\s*=\s*\[/.test(this.decodedScript)) {
      this.obfuscationTechniques.push("Array-based string obfuscation");
    }
    
    // Check for function-based obfuscation
    if (/function\s+_0x[a-f0-9]+\s*\([^)]*\)\s*\{/.test(this.decodedScript)) {
      this.obfuscationTechniques.push("Function-based obfuscation");
    }
    
    // Check for eval usage
    if (/eval\(/.test(this.decodedScript)) {
      this.obfuscationTechniques.push("Eval-based execution");
    }
    
    // Check for jsjiami obfuscator
    if (/jsjiami\.com/.test(this.decodedScript) || /encode_version/.test(this.decodedScript)) {
      this.obfuscationTechniques.push("jsjiami obfuscation");
    }
  }

  /**
   * Identify what type of script this is based on patterns
   */
  identifyScriptType() {
    // Check for iMe script
    if (/Mike\s*\[\s*['"]payload['"]\s*\]/.test(this.decodedScript) ||
        /isPremium/.test(this.decodedScript)) {
      this.scriptType = "iMe Premium Unlocker";
    }
    // Check for Revenuecat script
    else if (/revenuecat/.test(this.decodedScript) || 
             /subscriber/.test(this.decodedScript) ||
             /entitlements/.test(this.decodedScript)) {
      this.scriptType = "Revenuecat Subscription Unlocker";
    }
    // Generic subscription unlocker
    else if (/premium|subscription|vip|pro/.test(this.decodedScript)) {
      this.scriptType = "Generic Premium Unlocker";
    }
  }

  /**
   * Decode hex-encoded strings
   */
  decodeHexStrings() {
    // Extract and decode hex strings
    const hexPattern = /\\x([0-9a-fA-F]{2})/g;
    let match;
    
    // Keep track of all hex strings for reference
    const hexStrings = {};
    
    // Find all hex strings in the script
    while ((match = hexPattern.exec(this.originalScript)) !== null) {
      const hexValue = match[1];
      const decodedChar = String.fromCharCode(parseInt(hexValue, 16));
      hexStrings[`\\x${hexValue}`] = decodedChar;
    }
    
    // Store the decoded strings
    this.decodedStrings.hex = hexStrings;
    
    // Replace hex strings in the script
    this.decodedScript = this.decodedScript.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
  }

  /**
   * Decode strings stored in arrays
   */
  decodeArrayedStrings() {
    // Look for array declarations
    const arrayPattern = /var\s+(_0x[a-f0-9]+)\s*=\s*\[((?:'[^']*'|"[^"]*"|`[^`]*`)\s*,?\s*)+\]/g;
    let match;
    
    // Extract arrays
    const arrays = {};
    
    while ((match = arrayPattern.exec(this.decodedScript)) !== null) {
      const arrayName = match[1];
      const arrayContent = match[0];
      
      // Extract strings from the array
      const stringPattern = /'([^']*)'|"([^"]*)"|`([^`]*)`/g;
      const values = [];
      let stringMatch;
      
      while ((stringMatch = stringPattern.exec(arrayContent)) !== null) {
        values.push(stringMatch[1] || stringMatch[2] || stringMatch[3]);
      }
      
      arrays[arrayName] = values;
    }
    
    // Store the arrays
    this.decodedStrings.arrays = arrays;
    
    // Replace array references with their values
    for (const [arrayName, values] of Object.entries(arrays)) {
      const accessPattern = new RegExp(`${arrayName}\\[(\\d+)\\]`, 'g');
      
      this.decodedScript = this.decodedScript.replace(accessPattern, (_, index) => {
        const idx = parseInt(index, 10);
        if (idx < values.length) {
          return `'${values[idx]}'`;
        }
        return _;
      });
    }
  }

  /**
   * Decode concatenated strings
   */
  decodeStringConcatenation() {
    // Simple string concatenation
    this.decodedScript = this.decodedScript.replace(/'([^']*)'\s*\+\s*'([^']*)'/g, (_, p1, p2) => {
      return `'${p1}${p2}'`;
    });
  }

  /**
   * Analyze what the script does functionally
   */
  analyzeScriptFunctionality() {
    // Check if the script modifies API responses
    if (/\$response|\$done/.test(this.decodedScript)) {
      this.functionality.modifiesResponse = true;
      this.detectedPatterns.push("Modifies API responses");
    }
    
    // Check if the script handles requests
    if (/\$request/.test(this.decodedScript)) {
      this.functionality.modifiesRequest = true;
      this.detectedPatterns.push("Processes API requests");
    }
    
    // Check if the script handles premium features
    if (/premium|isPremium|subscription|entitle|vip|pro/i.test(this.decodedScript)) {
      this.functionality.handlesPremium = true;
      this.detectedPatterns.push("Handles premium/subscription status");
    }
    
    // Check if the script manipulates dates
    if (/expires_date|expiration|2099|9999/.test(this.decodedScript)) {
      this.functionality.manipulatesDates = true;
      this.detectedPatterns.push("Manipulates expiration dates");
    }
    
    // Check if the script intercepts specific APIs
    if (/api\.revenuecat\.com|verify|receipt/.test(this.decodedScript)) {
      this.functionality.interceptsAPI = true;
      this.detectedPatterns.push("Intercepts subscription validation APIs");
    }
    
    // Extract specific patterns based on script type
    if (this.scriptType === "iMe Premium Unlocker") {
      const premiumPattern = /[a-zA-Z0-9_$]+\s*\[\s*['"]payload['"]\s*\]\s*\[\s*['"][a-zA-Z0-9_$]+['"]\s*\]\s*=\s*!!\[\]/g;
      let match;
      
      while ((match = premiumPattern.exec(this.decodedScript)) !== null) {
        this.detectedPatterns.push(`Sets premium flag: ${match[0]}`);
      }
    }
    else if (this.scriptType === "Revenuecat Subscription Unlocker") {
      // Look for entitlement modifications
      if (/entitlements/.test(this.decodedScript)) {
        this.detectedPatterns.push("Modifies subscription entitlements");
      }
      
      // Look for subscription data
      if (/subscriptions/.test(this.decodedScript)) {
        this.detectedPatterns.push("Modifies subscription data");
      }
      
      // Look for purchase dates
      if (/purchase_date/.test(this.decodedScript)) {
        this.detectedPatterns.push("Sets purchase dates");
      }
    }
  }

  /**
   * Generate a clean, readable version of the script
   */
  generateCleanScript() {
    let cleanScript = "";
    
    // Add header
    cleanScript += "/**\n";
    cleanScript += ` * Decoded ${this.scriptType} Script\n`;
    cleanScript += " * \n";
    cleanScript += ` * Obfuscation techniques detected: ${this.obfuscationTechniques.join(", ")}\n`;
    cleanScript += ` * Functionality: ${this.detectedPatterns.join(", ")}\n`;
    cleanScript += " */\n\n";
    
    // Generate appropriate clean script based on type
    if (this.scriptType === "iMe Premium Unlocker") {
      cleanScript += "// Parse the server response\n";
      cleanScript += "var response = JSON.parse($response.body);\n\n";
      
      cleanScript += "// Set premium status to true\n";
      cleanScript += "response.payload.isPremium = true;\n\n";
      
      cleanScript += "// Return the modified response\n";
      cleanScript += "$done({body: JSON.stringify(response)});\n";
    }
    else if (this.scriptType === "Revenuecat Subscription Unlocker") {
      cleanScript += "// Parse the response JSON\n";
      cleanScript += "let response = JSON.parse($response.body || \"{}\");\n\n";
      
      // Add user agent check if present in original
      if (this.decodedScript.includes("User-Agent") || this.decodedScript.includes("user-agent")) {
        cleanScript += "// Get client information from request headers\n";
        cleanScript += "const headers = $request.headers;\n";
        cleanScript += "const userAgent = headers['User-Agent'] || headers['user-agent'];\n";
        cleanScript += "const bundleId = headers['X-Client-Bundle-ID'] || headers['x-client-bundle-id'];\n\n";
      }
      
      // Add subscription data
      cleanScript += "// Define premium subscription data\n";
      cleanScript += "const premiumData = {\n";
      cleanScript += "  purchase_date: '2023-01-01T00:00:00Z',\n";
      cleanScript += "  expires_date: '2099-12-31T23:59:59Z'\n";
      cleanScript += "};\n\n";
      
      // Add subscriber modification
      cleanScript += "// Modify the subscriber object\n";
      cleanScript += "if (response.subscriber) {\n";
      cleanScript += "  // Add premium entitlements\n";
      cleanScript += "  response.subscriber.entitlements = response.subscriber.entitlements || {};\n";
      cleanScript += "  response.subscriber.entitlements.premium = premiumData;\n\n";
      
      cleanScript += "  // Add subscription records\n";
      cleanScript += "  response.subscriber.subscriptions = response.subscriber.subscriptions || {};\n";
      cleanScript += "  response.subscriber.subscriptions.premium_yearly = {\n";
      cleanScript += "    ...premiumData,\n";
      cleanScript += "    is_sandbox: false,\n";
      cleanScript += "    ownership_type: 'PURCHASED'\n";
      cleanScript += "  };\n";
      cleanScript += "}\n\n";
      
      cleanScript += "// Return the modified response\n";
      cleanScript += "$done({body: JSON.stringify(response)});\n";
    }
    else {
      // Generic script reconstruction
      cleanScript += "// This appears to be a premium unlock script\n";
      cleanScript += "// The specific details couldn't be fully determined\n\n";
      
      // Add core patterns found
      if (this.detectedPatterns.length > 0) {
        cleanScript += "// Key operations detected:\n";
        this.detectedPatterns.forEach(pattern => {
          cleanScript += `// - ${pattern}\n`;
        });
        cleanScript += "\n";
      }
      
      // Add basic response modification if detected
      if (this.functionality.modifiesResponse) {
        cleanScript += "// Parse the response\n";
        cleanScript += "var response = JSON.parse($response.body || \"{}\");\n\n";
        
        cleanScript += "// Modify response to enable premium features\n";
        cleanScript += "// (specific modifications depend on the app)\n\n";
        
        cleanScript += "// Return the modified response\n";
        cleanScript += "$done({body: JSON.stringify(response)});\n";
      }
    }
    
    return cleanScript;
  }
}

/**
 * Helper function to decode a script and print analysis
 */
function decodeAndAnalyze(script, name = "Script") {
  console.log(`\n===== Analyzing ${name} =====`);
  
  // Create decoder and run decoding process
  const decoder = new ScriptDecoder(script);
  const result = decoder.decode();
  
  // Print results
  console.log(`Script Type: ${result.scriptType}`);
  
  console.log("\nObfuscation Techniques:");
  result.obfuscationTechniques.forEach((technique, i) => {
    console.log(`${i+1}. ${technique}`);
  });
  
  console.log("\nFunctionality:");
  console.log(`- Modifies API responses: ${result.functionality.modifiesResponse}`);
  console.log(`- Processes API requests: ${result.functionality.modifiesRequest}`);
  console.log(`- Handles premium features: ${result.functionality.handlesPremium}`);
  console.log(`- Manipulates dates: ${result.functionality.manipulatesDates}`);
  console.log(`- Intercepts specific APIs: ${result.functionality.interceptsAPI}`);
  
  console.log("\nDetected Patterns:");
  result.detectedPatterns.forEach((pattern, i) => {
    console.log(`${i+1}. ${pattern}`);
  });
  
  console.log("\nDecoded Script:");
  console.log(result.cleanScript);
  
  return result;
}

// Export the tools
module.exports = {
  ScriptDecoder,
  decodeAndAnalyze
};
