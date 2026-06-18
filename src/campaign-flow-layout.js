const tag = document.createElement("style");
tag.id = "campaign-flow-layout-fix";
tag.textContent = `
  .flow-shell { grid-template-columns: 280px minmax(420px, 1fr) 330px !important; }
  @media (max-width: 1280px) { .flow-shell { grid-template-columns: 1fr !important; } }
`;
document.head.appendChild(tag);
