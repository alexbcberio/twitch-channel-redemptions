import { Static, Type } from "@sinclair/typebox";

const Params = Type.Object({ id: Type.String({ format: "UUID" }) });
type ParamsType = Static<typeof Params>;

export { Params, ParamsType };
