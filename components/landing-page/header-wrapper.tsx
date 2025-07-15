import React from "react";
import Header from "./header";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";

const HeaderWrapper: React.FC = () => {
  const authComponent = !hasEnvVars ? <EnvVarWarning /> : <AuthButton />;

  return <Header authComponent={authComponent} />;
};

export default HeaderWrapper;
