export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-brand-dark mb-2">Política de Privacidade</h1>
      <p className="text-brand-muted mb-10">Última atualização: Junho 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Responsável pelo tratamento</h2>
          <p>ReaxOne — <a href="mailto:contact@reaxone.com" className="text-brand-primary hover:underline">contact@reaxone.com</a></p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Dados recolhidos</h2>
          <p>Recolhemos apenas os dados necessários para processar as tuas encomendas: nome, email, morada de entrega e número de telefone. Não recolhemos dados de cartão de crédito.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Finalidade</h2>
          <p>Os dados são utilizados exclusivamente para processamento de encomendas, comunicação sobre o estado das mesmas e emissão de faturas quando solicitado.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Partilha de dados</h2>
          <p>Não vendemos nem partilhamos os teus dados com terceiros para fins comerciais. Os dados podem ser partilhados com transportadoras para efeitos de entrega.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Os teus direitos</h2>
          <p>Tens direito a aceder, corrigir ou eliminar os teus dados pessoais. Para exercer estes direitos, contacta-nos em <a href="mailto:contact@reaxone.com" className="text-brand-primary hover:underline">contact@reaxone.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Cookies</h2>
          <p>Utilizamos apenas cookies essenciais para o funcionamento da loja (sessão de login). Não utilizamos cookies de rastreamento ou publicidade.</p>
        </section>

      </div>
    </div>
  );
}
