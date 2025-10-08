
export const getCategoryName = (category: string) => {
  const categories: { [key: string]: string } = {
    hymn: "Hino",
    praise: "Louvor",
    worship: "Adoração",
    chorus: "Coro",
    special: "Especial"
  };
  return categories[category] || category;
};