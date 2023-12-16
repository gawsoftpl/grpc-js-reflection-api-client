import { GrpcReflection } from "../../src";
import * as grpc from '@grpc/grpc-js';

describe("Test with lib @grpc/reflection as server of helloworld.proto", () => {
    let client;

    beforeEach(() => {
        client = new GrpcReflection("localhost:50053", grpc.ChannelCredentials.createInsecure());
    });

    it("List Service for wildcard", async () => {
        const services = await client.listServices();
        expect(services).toEqual(
            ['addressbook.AddressesService']
        );
    });

    it("Get proto file by symbol", (done) => {
        (async()=>{
            const descriptor = await client.getDescriptorByFileName('addressbook.proto');
            const packageObject = descriptor.getPackageObject({
                keepCase: true,
                enums: String,
                longs: String
            });

            const proto = new packageObject.addressbook.AddressesService(
                "localhost:50053",
                grpc.ChannelCredentials.createInsecure(),
            );

            proto.Add({
                name: "abc",
                email: "test@example.com"
            },(err,data)=>{
                if (err) return done(err)
                expect(data.id).toContain("123");
                expect(data.success).toBe(true);
                done();
            });


        })();
    });

});