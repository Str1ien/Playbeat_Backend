import e, { Request, Response, NextFunction } from "express";
import path from "path";
import * as etiquetasDbJs from "../../db/etiquetasDb.js";


// PRE: Verdad
// POST: Devuelve todas las etiquetas de canciones y podcasts
export const all = async (req: Request, res: Response) => {
    try {
      const allEtiquetasCancion: any = await etiquetasDbJs.songsTags();
      const allEtiquetasPodcast: any = await etiquetasDbJs.podcastTags();

      const allEtiquetas = [...allEtiquetasCancion, ...allEtiquetasPodcast];
  
      res.json(allEtiquetas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error obteniendo etiquetas" });
      throw new Error("Error obteniendo etiquetas");
    }
  };
  
// PRE: Verdad
// POST: Devuelve todas las etiquetas de canciones
export const songs = async (req: Request, res: Response) => {
  try {
    const cancionEtiquetas: any = await etiquetasDbJs.songsTags();

    res.json(cancionEtiquetas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo etiquetas de canciones" });
    throw new Error("Error obteniendo etiquetas de canciones");
  }
};

// PRE: Verdad
// POST: Devuelve todas las etiquetas de podcasts
export const podcast = async (req: Request, res: Response) => {
  try {
    const podcastEtiquetas: any = await etiquetasDbJs.podcastTags();

    res.json(podcastEtiquetas); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo etiquetas de podcasts" });
    throw new Error("Error obteniendo etiquetas de podcast");
  }
};


// PRE: Verdad
// POST: Devuelve todas las etiquetas que tiene el vector de Audios
export const tagsOfAudios = async (req: Request, res: Response) => {
  try {
    const { idsAudios } = req.body;

    // Verificar si "ids" es un array y no está vacío
    if (!Array.isArray(idsAudios) || idsAudios.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de audios en el cuerpo de la solicitud' });
    }

    // Obtener las etiquetas de los audios
    const etiquetasAudios = await Promise.all(idsAudios.map(async (id: number) => {
      const etiquetas = await etiquetasDbJs.tagsOfAudio(id);
      return { idAudio: id, etiquetas };
    }));

    res.json(etiquetasAudios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo etiquetas de los audios' });
  }
};


