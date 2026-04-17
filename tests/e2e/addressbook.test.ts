import { GrpcReflection } from "../../src";
import * as grpc from '@grpc/grpc-js';


describe("Test with lib grpc-node-server-reflection as server of helloworld.proto", () => {

    let client;
    const serverHost = "localhost:50052";

    beforeEach(() => {
        client = new GrpcReflection(serverHost, grpc.ChannelCredentials.createInsecure());
    });

    it("List Service for wildcard", async () => {
        const services = await client.listServices();
        expect(services).toEqual(
            ['addressbook.AddressesService']
        );
    });

    it("Get proto file by symbol", (done) => {
        (async()=>{
            const descriptor = await client.getDescriptorBySymbol('addressbook.AddressesService');
            const packageObject = descriptor.getPackageObject({
                keepCase: true,
                enums: String,
                longs: String
            });

            const proto = new packageObject.addressbook.AddressesService(
                serverHost,
                grpc.ChannelCredentials.createInsecure(),
            );

            proto.Add({
                name: "abc",
                email: "test@example.com"
            },(err,data)=>{
                if (err) return done(err);
                expect(data.id).toContain("123");
                expect(data.success).toBe(true);
                done();
            });


        })();
    });
});