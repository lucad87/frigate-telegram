const epochToDateTime = (epoch) => {
    return new Date(epoch * 1000).toLocaleString();
};

module.exports = epochToDateTime ;