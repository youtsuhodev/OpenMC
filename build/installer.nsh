!macro customHeader
  ; Branding de l'assistant d'installation OpenMC
  !define MUI_WELCOMEPAGE_TITLE "Bienvenue dans l'installation d'OpenMC"
  !define MUI_WELCOMEPAGE_TEXT "Cet assistant va installer OpenMC, le launcher Minecraft communautaire.$\r$\n$\r$\nCliquez sur Suivant pour continuer."
  !define MUI_FINISHPAGE_TITLE "Installation terminée"
  !define MUI_FINISHPAGE_TEXT "OpenMC a bien été installé. Bon jeu !$\r$\n$\r$\nVous pouvez lancer OpenMC depuis le raccourci du bureau ou le menu Démarrer."
!macroend

!macro customInstall
  SetShellVarContext current
!macroend

!macro customUnInstall
  SetShellVarContext current
!macroend
