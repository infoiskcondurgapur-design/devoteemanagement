export const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return convert(Math.floor(n / 100)) + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
        return '';
    };

    if (num === 0) return 'Zero';
    if (isNaN(num)) return '';
    
    let str = '';
    let n = Math.floor(Math.abs(num));
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    
    if (crore > 0) str += convert(crore) + 'Crore ';
    if (lakh > 0) str += convert(lakh) + 'Lakh ';
    if (thousand > 0) str += convert(thousand) + 'Thousand ';
    if (n > 0) str += convert(n);
    
    return str.trim() + ' Rupees Only';
};
