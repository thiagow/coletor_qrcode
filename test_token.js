
const SHA1 = require('crypto-js/sha1');

// Logic being tested
const generateDayToken = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // For validation, let's print the date used
    console.log(`Using Date: ${year}-${month}-${day}`);

    // Logic:
    const dateStr = `${year}${month}${day}`;
    // Fixed suffix
    const fixedSuffix = '_18531874000130';

    const key = `MPC2_${dateStr}${fixedSuffix}`;
    console.log(`Key generated: ${key}`);

    const hash = SHA1(key).toString().toUpperCase();
    return hash;
};

const tokenApp = generateDayToken();
const tokenReqBin = '226056DDE83865EBB16A72287F56DD863347519A';

console.log('---------------------------------------------------');
console.log(`Token App   : ${tokenApp}`);
console.log(`Token ReqBin: ${tokenReqBin}`);
console.log('---------------------------------------------------');

if (tokenApp === tokenReqBin) {
    console.log('✅ SUCESSO! A lógica está gerando o mesmo token.');
} else {
    console.log('❌ FALHA! Os tokens são diferentes.');
}
