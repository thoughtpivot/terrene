// Collects CSS text for the Heaven or Hell scene. The scene injects it on activate.
module.exports = function (source) {
    const css = JSON.stringify(String(source));
    return (
        "var css = " + css + ";\n" +
        "var host = typeof globalThis !== \"undefined\" ? globalThis : window;\n" +
        "if (!host.__HOH_CSS__) host.__HOH_CSS__ = [];\n" +
        "if (host.__HOH_CSS__.indexOf(css) === -1) host.__HOH_CSS__.push(css);\n" +
        "module.exports = css;\n"
    );
};
