export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-brand-dark mb-2">Termos e Condições</h1>
      <p className="text-brand-muted mb-10">Última atualização: Junho 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">1. Identificação</h2>
          <p>ReaxOne é uma marca portuguesa de equipamento desportivo. Contacto: <a href="mailto:contact@reaxone.com" className="text-brand-primary hover:underline">contact@reaxone.com</a></p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">2. Encomendas</h2>
          <p>Ao realizares uma encomenda, confirmas que tens pelo menos 18 anos e que os dados fornecidos são verdadeiros. A encomenda só é confirmada após verificação do pagamento.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">3. Preços</h2>
          <p>Todos os preços apresentados incluem IVA à taxa legal em vigor. Reservamo-nos o direito de alterar preços sem aviso prévio, sendo sempre aplicado o preço vigente no momento da encomenda.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">4. Pagamento</h2>
          <p>Aceitamos pagamento por MB Way e transferência bancária. As instruções de pagamento são enviadas por email após a encomenda. A encomenda é cancelada caso o pagamento não seja recebido em 48 horas.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">5. Direito de arrependimento</h2>
          <p>Tens direito a cancelar a encomenda no prazo de 14 dias após a receção, sem necessidade de justificação, de acordo com o Decreto-Lei n.º 24/2014.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">6. Propriedade intelectual</h2>
          <p>Todo o conteúdo deste website (imagens, textos, logótipos) é propriedade da ReaxOne e não pode ser reproduzido sem autorização expressa.</p>
        </section>

      </div>
    </div>
  );
}
