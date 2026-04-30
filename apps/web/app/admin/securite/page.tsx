"use client";

import { Card, Badge } from "@diaspo/ui";

export default function AdminSecuritePage() {
  return (
    <section className="grid gap-5">
      <header>
        <h2>Securite & 2FA</h2>
        <p className="mt-1 text-sm text-textMuted">Controle des acces administrateur et politiques de session.</p>
      </header>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="mb-1.5">Authentification administrateur</h3>
            <p>Le back-office admin est protege par identifiants dedies et un code 2FA.</p>
          </div>
          <Badge tone="green">2FA active</Badge>
        </div>
      </Card>

      <Card>
        <h3 className="mb-2">Mesures appliquées</h3>
        <ul className="m-0 grid gap-1.5 pl-[18px] text-textMid">
          <li>Accès administrateur isolé et protégé par contrôle de session.</li>
          <li>Pages d'administration exclues de l'indexation publique.</li>
          <li>Session administrateur avec expiration et invalidation automatique.</li>
        </ul>
      </Card>
    </section>
  );
}
