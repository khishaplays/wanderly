function SearchBar({ value, onChange }) {
  return (
    <div className="search-box">
      <span>⌕</span>

      <input
        type="search"
        placeholder="Search places, counties or experiences..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search Kenya"
      />
    </div>
  );
}

export default SearchBar;
