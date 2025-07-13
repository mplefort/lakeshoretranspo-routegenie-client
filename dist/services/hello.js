"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloService = void 0;
class HelloService {
    static getHelloMessage() {
        return {
            message: "Hello World from IPC!",
            timestamp: new Date().toISOString(),
            source: "Main Process"
        };
    }
    static getCustomMessage(name) {
        return {
            message: `Hello ${name} from IPC!`,
            timestamp: new Date().toISOString(),
            source: "Main Process"
        };
    }
}
exports.HelloService = HelloService;
//# sourceMappingURL=hello.js.map