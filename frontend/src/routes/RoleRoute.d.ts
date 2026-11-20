import React from "react";
import { type Role } from "../context/AuthContext";
export default function RoleRoute({ allow, children, }: {
    allow: Role[];
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
