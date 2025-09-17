import Image from "next/image";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Sampahin Logo"
          width={40}
          height={40}
          className="w-full h-full object-contain"
        />
      </div>
      <h3 className="font-bold text-3xl text-green-600">Sampahin</h3>
    </div>
  );
};
