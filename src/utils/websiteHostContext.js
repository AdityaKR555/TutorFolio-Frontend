import { createContext, useContext } from "react";
export const WebsiteHostContext = createContext({ kind: "platform" });
export function useWebsiteHost() { return useContext(WebsiteHostContext); }
