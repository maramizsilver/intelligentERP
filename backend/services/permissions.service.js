// backend/services/permissions.service.js

/**
 * Crée les lignes de permissions manquantes pour TOUS les rôles d'une
 * base tenant, pour TOUS les modules existants. Utile si :
 * - un rôle a été créé sans que toutes les cases de la matrice soient
 *   sauvegardées correctement
 * - un module a été ajouté à la table "modules" après la création du
 *   rôle (les anciens rôles n'ont alors aucune ligne pour ce module)
 * L'Admin Entreprise reçoit systématiquement TOUT en TRUE ; les autres
 * rôles reçoivent une ligne par défaut (tout en FALSE) pour que
 * l'administrateur puisse ensuite cocher ce qu'il veut, sans jamais
 * planter le checkPermission (0 ligne trouvée = 403 par défaut).
 */
async function reparerPermissionsManquantes(clientPool) {
    const [roles] = await clientPool.promise().query('SELECT id, est_admin_entreprise FROM roles');
    const [modules] = await clientPool.promise().query('SELECT id FROM modules');

    let lignesAjoutees = 0;

    for (const role of roles) {
        for (const module of modules) {
            const [existe] = await clientPool.promise().query(
                'SELECT id FROM permissions WHERE role_id = ? AND module_id = ?',
                [role.id, module.id]
            );

            if (existe.length === 0) {
                const valeur = !!role.est_admin_entreprise;
                await clientPool.promise().query(
                    `INSERT INTO permissions
                     (role_id, module_id, consultation, creation, modification, suppression, validation, export)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [role.id, module.id, valeur, valeur, valeur, valeur, valeur, valeur]
                );
                lignesAjoutees++;
            }
        }
    }

    return { lignesAjoutees, totalRoles: roles.length, totalModules: modules.length };
}

module.exports = { reparerPermissionsManquantes };