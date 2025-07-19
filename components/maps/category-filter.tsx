type Category = "all" | "clean" | "dirty";

interface Props {
  categoryFilter: Category;
  setCategoryFilter: (value: Category) => void;
}

const CategoryFilter = ({ categoryFilter, setCategoryFilter }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-5 py-2 font-bold text-sm rounded-full ${
            categoryFilter === "all"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setCategoryFilter("clean")}
          className={`px-5 py-2 font-bold text-sm rounded-full ${
            categoryFilter === "clean"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Bersih
        </button>
        <button
          onClick={() => setCategoryFilter("dirty")}
          className={`px-5 py-2 font-bold text-sm rounded-full ${
            categoryFilter === "dirty"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Kotor
        </button>
      </div>
    </div>
  );
};

export default CategoryFilter;
