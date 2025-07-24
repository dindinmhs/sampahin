type Category = "all" | "clean" | "dirty" | "cleaning";

interface Props {
  categoryFilter: Category;
  setCategoryFilter: (value: Category) => void;
}

const CategoryFilter = ({ categoryFilter, setCategoryFilter }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center md:justify-start gap-2 md:gap-4">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 md:px-5 md:py-2 font-bold text-xs md:text-sm rounded-full shadow-sm ${
            categoryFilter === "all"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setCategoryFilter("clean")}
          className={`px-3 py-1.5 md:px-5 md:py-2 font-bold text-xs md:text-sm rounded-full shadow-sm ${
            categoryFilter === "clean"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Bersih
        </button>
        <button
          onClick={() => setCategoryFilter("dirty")}
          className={`px-3 py-1.5 md:px-5 md:py-2 font-bold text-xs md:text-sm rounded-full shadow-sm ${
            categoryFilter === "dirty"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Kotor
        </button>
        <button
          onClick={() => setCategoryFilter("cleaning")}
          className={`px-3 py-1.5 md:px-5 md:py-2 font-bold text-xs md:text-sm rounded-full shadow-sm ${
            categoryFilter === "cleaning"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Sedang Dibersihkan
        </button>
      </div>
    </div>
  );
};

export default CategoryFilter;
