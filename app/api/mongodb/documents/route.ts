/**
 * API Route: CRUD operations for documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { findDocuments, insertDocument, updateDocument, deleteDocument } from '@/services/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Convert Extended JSON / shell-normalized filters into BSON values the driver expects.
 * e.g. { _id: { $oid: "..." } } → { _id: ObjectId("...") }
 */
function convertIdFilter(value: any): any {
  if (Array.isArray(value)) {
    return value.map(convertIdFilter);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (typeof value.$oid === 'string') {
    try {
      return new ObjectId(value.$oid);
    } catch {
      return value.$oid;
    }
  }

  if (typeof value.$date === 'string') {
    return new Date(value.$date);
  }

  if (typeof value.$numberLong === 'string') {
    return Number(value.$numberLong);
  }

  const converted: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(value)) {
    if (key === '_id' && typeof nested === 'string') {
      try {
        converted[key] = new ObjectId(nested);
      } catch {
        converted[key] = nested;
      }
    } else {
      converted[key] = convertIdFilter(nested);
    }
  }

  return converted;
}

// GET/POST documents (find/query)
export async function POST(request: NextRequest) {
  try {
    const { uri, database, collection, filter = {}, options = {} } = await request.json();

    if (!uri || !database || !collection) {
      return NextResponse.json(
        { success: false, error: 'URI, database, and collection are required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Convert _id strings to ObjectId if present
    const convertedFilter = convertIdFilter(filter);

    const result = await findDocuments(uri, database, collection, convertedFilter, options);

    return NextResponse.json(
      {
        success: true,
        data: {
          documents: result.documents,
          total: result.total,
          page: Math.floor((options.skip || 0) / (options.limit || 50)) + 1,
          pageSize: options.limit || 50,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// PUT - Insert document
export async function PUT(request: NextRequest) {
  try {
    const { uri, database, collection, document } = await request.json();

    if (!uri || !database || !collection || !document) {
      return NextResponse.json(
        { success: false, error: 'URI, database, collection, and document are required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    const result = await insertDocument(uri, database, collection, document);

    return NextResponse.json(
      {
        success: true,
        data: { insertedId: result.insertedId },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error inserting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to insert document',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// PATCH - Update document
export async function PATCH(request: NextRequest) {
  try {
    const { uri, database, collection, filter, update } = await request.json();

    if (!uri || !database || !collection || !filter || !update) {
      return NextResponse.json(
        { success: false, error: 'URI, database, collection, filter, and update are required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Convert _id strings to ObjectId if present
    const convertedFilter = convertIdFilter(filter);

    const result = await updateDocument(uri, database, collection, convertedFilter, update);

    return NextResponse.json(
      {
        success: true,
        data: { modifiedCount: result.modifiedCount },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const { uri, database, collection, filter } = await request.json();

    if (!uri || !database || !collection || !filter) {
      return NextResponse.json(
        { success: false, error: 'URI, database, collection, and filter are required' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Convert _id strings to ObjectId if present
    const convertedFilter = convertIdFilter(filter);

    const result = await deleteDocument(uri, database, collection, convertedFilter);

    return NextResponse.json(
      {
        success: true,
        data: { deletedCount: result.deletedCount },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
