export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#1313ec",
                "background-light": "#f6f6f8",
                "background-dark": "#101022"
            },
            fontFamily: {
                display: ["Inter", "sans-serif"]
            }
        }
    },
    plugins: []
};
