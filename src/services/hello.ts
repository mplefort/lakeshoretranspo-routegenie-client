export interface HelloResponse {
  message: string;
  timestamp: string;
  source: string;
}

export class HelloService {
  static getHelloMessage(): HelloResponse {
    return {
      message: "Hello World from IPC!",
      timestamp: new Date().toISOString(),
      source: "Main Process"
    };
  }

  static getCustomMessage(name: string): HelloResponse {
    return {
      message: `Hello ${name} from IPC!`,
      timestamp: new Date().toISOString(),
      source: "Main Process"
    };
  }
}
