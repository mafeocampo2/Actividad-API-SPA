import { createserver } from "./server";

const app = createserver();
// Render (y otros hostings) indican el puerto con la variable PORT
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
