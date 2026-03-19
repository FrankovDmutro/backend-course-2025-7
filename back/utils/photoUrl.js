function buildPhotoUrl(host, port, id) {
    return `http://${host}:${port}/inventory/${id}/photo`;
}

module.exports = buildPhotoUrl;
