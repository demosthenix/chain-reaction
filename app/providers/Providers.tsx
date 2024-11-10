"use client";

import { ReactNode } from "react";
import { RecoilRoot } from "recoil";
import { SocketProvider } from "./SocketProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <RecoilRoot>
      <SocketProvider>{children}</SocketProvider>
    </RecoilRoot>
  );
}
