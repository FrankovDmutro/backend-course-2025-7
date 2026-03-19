function buildPhotoUrl(req, id) {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;
    if (publicBaseUrl) {
        return `${publicBaseUrl}/inventory/${id}/photo`;
    }

    const forwardedProto = req.get('x-forwarded-proto');
    const forwardedHost = req.get('x-forwarded-host');
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get('host');

    return `${protocol}://${host}/inventory/${id}/photo`;
}

module.exports = buildPhotoUrl;
