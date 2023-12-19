import {packageObjectHelper, serviceHelper} from "../../src";
import * as grpc from "@grpc/grpc-js";

interface AddressesServiceAddPayload {
    name: string
    email: string
}

interface AddressesServiceAddResponse {
    success: boolean
    id: string
}

interface AddressesServiceInterface {
    Add: (obj: AddressesServiceAddPayload, ...rest: any) => Promise<AddressesServiceAddResponse>
}

describe("Test Helpers", () => {

    it('Should create packageobject addressbook by filename', async() => {
        const packageObject = await packageObjectHelper({
            host: "localhost:50053",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_filename: 'addressbook.proto',
            protoLoaderOptions: {
                keepCase: true
            }
        });

        expect(packageObject).toBeDefined()

    })

    it('Should create packageobject addressbook by symbol', async() => {
        const packageObject = await packageObjectHelper({
            host: "localhost:50053",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_symbol: 'addressbook.AddressesService',
            protoLoaderOptions: {
                keepCase: true
            }
        });

        expect(packageObject).toBeDefined()
    })

    it('Should create Service by proto file name', (done) => {
        const packageObject = serviceHelper<AddressesServiceInterface>({
            host: "localhost:50053",
            servicePath: "addressbook.AddressesService",
            credentials: grpc.ChannelCredentials.createInsecure(),
            proto_filename: 'addressbook.proto',
            protoLoaderOptions: {
                keepCase: true
            }
        }).then(proto => {
            expect(packageObject).toBeDefined()
            proto.Add({
                name: "abc",
                email: "test@example.com"
            }, (err, response) => {
                if (err) return done(err);
                expect(response.id).toContain("123");
                expect(response.success).toBe(true);
                done();
            });
        })
    })
})