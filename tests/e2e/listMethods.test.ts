import {GrpcReflection} from "../../src";
import * as grpc from '@grpc/grpc-js';

describe("Test list methods of helloworld.proto", () => {
    let client;

    beforeEach(()=>{
        client = new GrpcReflection("localhost:50051", grpc.ChannelCredentials.createInsecure());
    });

    it("List methods for services", (done) =>{
        const methods = client.listMethods('helloworld.Greeter')
            .then((methods) => {
                const methodsNames = methods.map((method) => method.name);
                expect(methodsNames).toEqual(
                    [
                        "SayHello"
                    ]
                );
                done();
            });

    });

});