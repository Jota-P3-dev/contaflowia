export interface BrazilianState {
  uf: string;
  name: string;
  capital: string;
}

export const brazilianStates: BrazilianState[] = [
  { uf: "AC", name: "Acre", capital: "Rio Branco" },
  { uf: "AL", name: "Alagoas", capital: "Maceió" },
  { uf: "AP", name: "Amapá", capital: "Macapá" },
  { uf: "AM", name: "Amazonas", capital: "Manaus" },
  { uf: "BA", name: "Bahia", capital: "Salvador" },
  { uf: "CE", name: "Ceará", capital: "Fortaleza" },
  { uf: "DF", name: "Distrito Federal", capital: "Brasília" },
  { uf: "ES", name: "Espírito Santo", capital: "Vitória" },
  { uf: "GO", name: "Goiás", capital: "Goiânia" },
  { uf: "MA", name: "Maranhão", capital: "São Luís" },
  { uf: "MT", name: "Mato Grosso", capital: "Cuiabá" },
  { uf: "MS", name: "Mato Grosso do Sul", capital: "Campo Grande" },
  { uf: "MG", name: "Minas Gerais", capital: "Belo Horizonte" },
  { uf: "PA", name: "Pará", capital: "Belém" },
  { uf: "PB", name: "Paraíba", capital: "João Pessoa" },
  { uf: "PR", name: "Paraná", capital: "Curitiba" },
  { uf: "PE", name: "Pernambuco", capital: "Recife" },
  { uf: "PI", name: "Piauí", capital: "Teresina" },
  { uf: "RJ", name: "Rio de Janeiro", capital: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte", capital: "Natal" },
  { uf: "RS", name: "Rio Grande do Sul", capital: "Porto Alegre" },
  { uf: "RO", name: "Rondônia", capital: "Porto Velho" },
  { uf: "RR", name: "Roraima", capital: "Boa Vista" },
  { uf: "SC", name: "Santa Catarina", capital: "Florianópolis" },
  { uf: "SP", name: "São Paulo", capital: "São Paulo" },
  { uf: "SE", name: "Sergipe", capital: "Aracaju" },
  { uf: "TO", name: "Tocantins", capital: "Palmas" },
];

export const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
];
