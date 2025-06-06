import { Input } from "@/components/form/input";

export const Fields = () => {
  return (
    <>
      <Input name="userLogin" type="email" label="Informe o seu Email" />
      <Input name="password" label="Senha" type="password" />
    </>
  );
};
