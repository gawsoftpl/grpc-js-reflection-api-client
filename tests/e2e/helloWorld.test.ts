import { GrpcReflection } from "../../src";
import * as grpc from '@grpc/grpc-js';

describe("List all service via grpc reflection", () => {
    it("List Service for hello world", async() =>{
         const client = new GrpcReflection("localhost:50051", grpc.credentials.createInsecure());
         const services = await client.listServices();

         expect(services).toEqual(
             [ 'grpc.reflection.v1alpha.ServerReflection', 'helloworld.Greeter' ]
         );

         //const descriptor = await client.getDescriptorBySymbol('apidata');

        // // Get @grpc/grpc-js package object
        // const packageObject = descriptor.getPackageObject({
        //     keepCase: true,
        //     enums: String,
        //     longs: String
        // });
        //
        // var proto = new packageObject.apidata.ApiKeyService(
        //     '127.0.0.1:50051',
        //     grpc.credentials.createInsecure()
        // );
        //
        // // Execute rpc command
        // proto.SayHello({"name":"hello"},(d)=>{
        //     console.log(d);
        // });

    });
});