function SearchBar({ value, onChange, label = "Search Kenya", placeholder = "Search places, counties or experiences..." }) {
  return (
    <div className="search-box">
      <span>⌕</span>

      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      />
    </div>
  );
}

export default SearchBar;
