import * as express from 'express';
import ArticlesController from "./articles.controller";
class App {
    public app: express.Application;
    public port: number;

    constructor(controllers: ArticlesController[], port:number) {
        this.app = express();
        this.port = port;

        this.initializeMiddlewares();
        this.initializeControllers(controllers);
    }

    private initializeMiddlewares() {
        this.app.use(express.json());
    }

    private initializeControllers(controllers:ArticlesController[]) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`Server started on ${this.port} port`);
        });
    }
}

export default App;