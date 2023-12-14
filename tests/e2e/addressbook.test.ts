import { GrpcReflection } from "../../src";
import * as grpc from '@grpc/grpc-js';

describe("Test of helloworld.proto", () => {
    let client;

    beforeEach(() => {
        client = new GrpcReflection("localhost:50052", grpc.ChannelCredentials.createInsecure());
    });

    it("List Service for wildcard", async () => {
        const services = await client.listServices();

        expect(services).toEqual(
            ['grpc.reflection.v1alpha.ServerReflection','tutorial.AddressesService']
        );
    });

    it("Get proto file by symbol", (done) => {
        (async()=>{
            const descriptor = await client.getDescriptorBySymbol('tutorial');
            const packageObject = descriptor.getPackageObject({
                keepCase: true,
                enums: String,
                longs: String
            });

            const proto = new packageObject.tutorial.AddressesService(
                 "localhost:50052",
                 grpc.ChannelCredentials.createInsecure(),
            );

            proto.Add({
                name: "abc",
                email: "test@example.com"
            },(err,data)=>{
                expect(data.id).toContain("123");
                expect(data.success).toBe(true);
                done();
            });


        })();
    });
});