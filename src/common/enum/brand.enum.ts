export enum SortEnum {
  NEWEST = "newest",
  OLDEST = "oldest",
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  UPDATED_DESC = "updated_desc",
}
export const BrandSortEnum = {
    [SortEnum.NEWEST] : {_id : -1},
    [SortEnum.OLDEST] : {_id : 1},
    [SortEnum.NAME_DESC] : {name : -1 , _id : -1}, // name z-a
    [SortEnum.NAME_ASC] : {name : 1 , _id : 1}, // name a-z
    [SortEnum.UPDATED_DESC] : {updatedAt : -1 , _id : -1} // the lastes updates
}