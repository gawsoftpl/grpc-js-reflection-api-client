import {GrpcReflection, ReflectionRequestException} from "../../src";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from "@grpc/proto-loader";

describe("Test of helloworld.proto", () => {
    let client;

    beforeEach(()=>{
        client = new GrpcReflection("localhost:50051", grpc.credentials.createInsecure());
    });

    it("List Service for wildcard", async() =>{
         const services = await client.listServices();

         expect(services).toEqual(
             [ 'grpc.examples.echo.Echo','grpc.reflection.v1alpha.ServerReflection', 'helloworld.Greeter' ]
         );
    });


    it("List Service for hello world", async() =>{
        const services = await client.listServices('helloworld.Greeter');

        expect(services).toEqual(
            [ 'grpc.examples.echo.Echo','grpc.reflection.v1alpha.ServerReflection', 'helloworld.Greeter' ]
        );
    });

    it("Get list Of extensions", async() =>{
        const extensions = await client.getAllExtensionNumbersOfType(
            "helloworld.HelloRequest",
        );

        expect(extensions).toEqual({
            "base_type_name": "helloworld.HelloRequest",
            "extension_number": [],
        });

    });

    it("Get proto file by name", (done) => {

        (async()=>{
            const descriptor = await client.getDescriptorByFileName('examples/helloworld/helloworld/helloworld.proto');
            const packageObject = descriptor.getPackageObject({
                keepCase: true,
                enums: String,
                longs: String
            });

            const proto = new packageObject.helloworld.Greeter(
                "localhost:50051",
                grpc.credentials.createInsecure(),
            );

            proto.SayHello({
                name: "abc"
            },(err,data)=>{
                expect(data.message).toContain("abc");
                done();
            });
        })();

    });

    it("Get proto file by name not exists - catch exception", async() => {
        await expect(client.getDescriptorByFileName('not-exists.proto'))
            .rejects
            .toThrow(ReflectionRequestException);
    });

    it("Get proto file by symbol not exists - catch exception", async() => {
        await expect(client.getDescriptorBySymbol('not-exists'))
            .rejects
            .toThrow(ReflectionRequestException);
    });

    it("Wrong host. Throw error on UNAVAILABLE: No connection established\n - catch exception", async() => {
        const client2 = new GrpcReflection("localhost:50053", grpc.credentials.createInsecure());
        await expect(client.getDescriptorBySymbol('not-exists'))
            .rejects
            .toThrow(ReflectionRequestException);
    });

    it("Get proto file by symbol", (done) => {
        (async()=>{
            const descriptor = await client.getDescriptorBySymbol('helloworld.Greeter');
            const packageObject = descriptor.getPackageObject({
                keepCase: true,
                enums: String,
                longs: String
            });

            const proto = new packageObject.helloworld.Greeter(
                "localhost:50051",
                grpc.credentials.createInsecure(),
            );

            proto.SayHello({
                name: "abc"
            },(err,data)=>{
                expect(data.message).toContain("abc");
                done();
            });
        })();
    });



});