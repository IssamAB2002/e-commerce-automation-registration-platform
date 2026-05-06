import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
        ('conversations', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('customer_name', models.CharField(max_length=200)),
                ('customer_phone', models.CharField(max_length=50)),
                ('delivery_address', models.TextField()),
                ('notes', models.TextField(blank=True)),
                ('product_name', models.CharField(max_length=300)),
                ('quantity', models.IntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('confirmed', 'Confirmed'),
                             ('cancelled', 'Cancelled'), ('delivered', 'Delivered')],
                    db_index=True, default='pending', max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='orders', to='accounts.clientprofile',
                )),
                ('conversation', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='orders', to='conversations.conversation',
                )),
            ],
            options={'db_table': 'crm_orders', 'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['client', 'status'], name='crm_orders_client_status_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['client', 'created_at'], name='crm_orders_client_created_idx'),
        ),
    ]
