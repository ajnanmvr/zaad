export function numberToWords(num: number): string {
    if (num === 0) return "Zero";

    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const scales = ["", "Thousand", "Million", "Billion"];

    function convertHundreds(n: number): string {
        let result = "";

        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + " Hundred";
            n %= 100;
            if (n > 0) result += " ";
        }

        if (n >= 20) {
            result += tens[Math.floor(n / 10)];
            n %= 10;
            if (n > 0) result += " " + ones[n];
        } else if (n > 0) {
            result += ones[n];
        }

        return result;
    }

    if (num < 0) return "Negative " + numberToWords(-num);

    // Handle decimal part
    const [integerPart, decimalPart] = num.toString().split('.');
    let intNum = parseInt(integerPart);

    if (intNum === 0) {
        let result = "Zero";
        if (decimalPart && parseInt(decimalPart) > 0) {
            const decimals = parseInt(decimalPart.padEnd(2, '0').slice(0, 2));
            result += " and " + numberToWords(decimals) + " Fils";
        }
        return result;
    }

    let result = "";
    let scaleIndex = 0;

    while (intNum > 0) {
        let chunk = intNum % 1000;
        if (chunk !== 0) {
            let chunkWords = convertHundreds(chunk);
            if (scaleIndex > 0) {
                chunkWords += " " + scales[scaleIndex];
            }
            result = chunkWords + (result ? " " + result : "");
        }
        intNum = Math.floor(intNum / 1000);
        scaleIndex++;
    }

    // Add decimal part (fils)
    if (decimalPart && parseInt(decimalPart) > 0) {
        const decimals = parseInt(decimalPart.padEnd(2, '0').slice(0, 2));
        result += " and " + numberToWords(decimals) + " Fils";
    }

    return result;
}

export function formatAmountInWords(amount: number): string {
    const [integerPart, decimalPart] = amount.toString().split('.');
    let result = numberToWords(parseInt(integerPart)) + " Dirhams";

    if (decimalPart && parseInt(decimalPart) > 0) {
        const decimals = parseInt(decimalPart.padEnd(2, '0').slice(0, 2));
        result += " and " + numberToWords(decimals) + " Fils";
    }

    result += " Only";
    return result;
}
