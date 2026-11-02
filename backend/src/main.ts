import { createserver } from "./server";

const app = createserver();
const port = 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
