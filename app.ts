import express from "express";
import { Controller } from "./controllers";

class App {
  public app: express.Application;
  public port: number;

  constructor(controllers: Controller[], port: number) {
    this.app = express();
    this.port = port;

    this.app.use(express.json());

    controllers.forEach((controller) => {
      this.app.use("/", controller.router);
    });
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Server started on ${this.port} port`);
    });
  }
}

export default App;
