export const generateOrderNo = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    // 实际项目中流水号应由后端下发，前端可先模拟随机4位
    const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QX${year}${month}${day}${seq}`;
};

export const getCurrentDate = () => new Date().toISOString().split('T')[0];